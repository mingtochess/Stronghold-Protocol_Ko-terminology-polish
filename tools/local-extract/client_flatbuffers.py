"""Read the limited FlatBuffers table/enum grammar used by bundled CN schemas.

Pure Python: no flatc executable or generated native bindings on Windows.
All values come from local client bytes; schemas describe binary layout only.
Unsupported schema constructs and malformed offsets fail explicitly.
"""
from functools import lru_cache
from pathlib import Path
import re
import struct

SCALARS = {'bool': '?', 'byte': 'b', 'ubyte': 'B', 'short': 'h', 'ushort': 'H',
           'int': 'i', 'uint': 'I', 'long': 'q', 'ulong': 'Q', 'float': 'f', 'double': 'd'}


@lru_cache(maxsize=16)
def schema(name):
    if not re.fullmatch(r'[a-z_]+', name): raise ValueError('Invalid schema name')
    path = Path(__file__).with_name('cn-schemas')/(name+'.fbs')
    if not path.is_file(): raise ValueError('No bundled CN FlatBuffers schema for '+name)
    text = re.sub(r'//[^\n]*|/\*.*?\*/', '', path.read_text('utf-8'), flags=re.S)
    if re.search(r'\b(struct|union|include)\b', text): raise ValueError('Unsupported FlatBuffers schema construct')
    enums, tables = {}, {}
    for enum, underlying, body in re.findall(r'enum\s+(\w+)\s*:\s*(\w+)\s*\{(.*?)\}', text, re.S):
        values = {}; current = -1
        for item in body.split(','):
            if not item.strip(): continue
            label, *explicit = item.strip().split('=')
            current = int(explicit[0].strip(), 0) if explicit else current+1
            values[current] = label.strip()
        enums[enum] = (underlying, values)
    for table, body in re.findall(r'table\s+(\w+)\s*\{(.*?)\}', text, re.S):
        fields = []
        for item in body.split(';'):
            if not item.strip(): continue
            match = re.fullmatch(r'\s*(\w+)\s*:\s*(\[\w+\]|\w+)\s*(?:=\s*([^()]+?))?\s*(?:\(key\))?\s*', item)
            if not match: raise ValueError('Unsupported schema field: '+item.strip())
            fields.append(match.groups())
        tables[table] = fields
    root = re.search(r'root_type\s+(\w+)\s*;', text)
    if not root or root[1] not in tables: raise ValueError('Missing FlatBuffers root type')
    return root[1], enums, tables


class Reader:
    def __init__(self, data, enums, tables):
        self.data, self.enums, self.tables = data, enums, tables
        self.budget = 3_000_000
        self.active = set()

    def unpack(self, fmt, offset):
        if offset < 0 or offset+struct.calcsize('<'+fmt) > len(self.data):
            raise ValueError('FlatBuffers offset outside payload')
        return struct.unpack_from('<'+fmt, self.data, offset)[0]

    def indirect(self, offset):
        delta = self.unpack('I', offset)
        if delta < 4: raise ValueError('Invalid FlatBuffers reference')
        return offset+delta

    def value(self, kind, offset, depth):
        self.budget -= 1
        if self.budget < 0 or depth > 128: raise ValueError('FlatBuffers decode limit exceeded')
        if kind in SCALARS: return self.unpack(SCALARS[kind], offset)
        if kind in self.enums:
            base, values = self.enums[kind]
            number = self.unpack(SCALARS[base], offset)
            return values.get(number, number)
        target = self.indirect(offset)
        if kind == 'string':
            size = self.unpack('I', target)
            start = target+4
            if start+size >= len(self.data) or self.data[start+size] != 0: raise ValueError('Invalid FlatBuffers string')
            return self.data[start:start+size].decode('utf-8')
        if kind.startswith('['):
            element = kind[1:-1]; count = self.unpack('I', target)
            base = self.enums[element][0] if element in self.enums else element
            width = struct.calcsize('<'+SCALARS[base]) if base in SCALARS else 4
            if count > 1_000_000 or target+4+count*width > len(self.data): raise ValueError('Invalid FlatBuffers vector')
            rows = [self.value(element, target+4+i*width, depth+1) for i in range(count)]
            if element in self.tables and [f[0] for f in self.tables[element]] == ['key', 'value']:
                result = {}
                for row in rows:
                    key = str(row['key'])
                    if key in result: raise ValueError('Duplicate FlatBuffers dictionary key')
                    result[key] = row['value']
                return result
            return rows
        return self.table(kind, target, depth+1)

    def default(self, kind, explicit):
        if kind in self.enums:
            base, values = self.enums[kind]
            if explicit:
                label = explicit.strip()
                if label in values.values(): return label
                return values.get(int(label, 0), int(label, 0))
            return values.get(0, 0)
        if kind in SCALARS:
            if kind == 'bool': return explicit == 'true' if explicit else False
            return float(explicit or 0) if kind in ('float', 'double') else int(explicit or '0', 0)
        return None

    def table(self, kind, position, depth=0):
        if kind not in self.tables: raise ValueError('Unknown FlatBuffers field type '+kind)
        if (kind, position) in self.active: raise ValueError('Cyclic FlatBuffers reference')
        if depth > 128: raise ValueError('FlatBuffers nesting limit exceeded')
        self.active.add((kind, position))
        try:
            vtable = position-self.unpack('i', position)
            size = self.unpack('H', vtable); object_size = self.unpack('H', vtable+2)
            if size < 4 or size % 2 or vtable+size > len(self.data) or object_size < 4 or position+object_size > len(self.data):
                raise ValueError('Invalid FlatBuffers vtable')
            if (size-4)//2 > len(self.tables[kind]): raise ValueError('CN schema has fewer fields than client table '+kind)
            result = {}
            for i, (name, field_type, explicit) in enumerate(self.tables[kind]):
                location = vtable+4+i*2
                relative = self.unpack('H', location) if location+2 <= vtable+size else 0
                if relative and (relative < 4 or relative >= object_size): raise ValueError('Invalid FlatBuffers field offset')
                result[name] = self.value(field_type, position+relative, depth+1) if relative else self.default(field_type, explicit)
            return result
        finally:
            self.active.remove((kind, position))


def decode(payload, name):
    root, enums, tables = schema(name)
    # Arknights FBO files have a 128-byte signature before the FlatBuffer.
    if len(payload) < 136: raise ValueError('Truncated signed FlatBuffers table')
    reader = Reader(payload[128:], enums, tables)
    result = reader.table(root, reader.indirect(0))
    wrapper = {'character_table': 'characters', 'skill_table': 'skills', 'battle_equip_table': 'equips'}.get(name)
    result = result[wrapper] if wrapper else result
    if not isinstance(result, dict): raise ValueError('FlatBuffers root did not decode to a dictionary')
    return result
