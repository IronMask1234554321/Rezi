import { assert, test } from "@rezi-ui/testkit";
import { TurnScheduler } from "../turnScheduler.js";
import { flushMicrotasks } from "./helpers.js";

test("turn scheduler is FIFO and non-reentrant (#58)", async () => {
  const log: number[] = [];
  let turn = 0;

  const scheduler = new TurnScheduler<(turnNo: number) => void>((items) => {
    turn++;
    for (const fn of items) fn(turn);
  });

  scheduler.enqueue((t) => {
    log.push(t * 10 + 1);
    scheduler.enqueue((t2) => log.push(t2 * 10 + 3));
  });
  scheduler.enqueue((t) => log.push(t * 10 + 2));

  await flushMicrotasks(5);
  assert.deepEqual(log, [11, 12, 23]);
});
