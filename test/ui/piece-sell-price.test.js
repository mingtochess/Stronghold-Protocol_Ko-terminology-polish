// 海沫 「休整期结束时自身售出价格+1」 (SERVER_SELF_SELL_PRICE_DELTA): the server raised the piece's price (pieceView
// sellPrice) but the sell button showed the record's table price (user report 2026-11-17: "the trait does nothing").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { underframeActions } from '../../public/js/ui/facing.js';

test('the sell button shows the piece\'s raised price, else the table price', () => {
  const getChess = () => ({ sellPrice: 1 });
  const ctx = (piece) => ({ getChess, pieces: new Map([[1, { piece: { uid: 1, kind: 'chess', id: 'chess_char_3_04_a', ...piece }, area: 'board' }]]) });
  assert.equal(underframeActions(ctx({ sellPrice: 4 }), 1).sell, 4);
  assert.equal(underframeActions(ctx({}), 1).sell, 1);
});
