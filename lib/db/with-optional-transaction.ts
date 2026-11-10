import { NextResponse } from "next/server";
import mongoose from "mongoose";

function isReplicaSetRequiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("replica set") ||
    message.includes("Transaction numbers are only allowed")
  );
}

/**
 * Standalone mongod accepts startTransaction() in the driver, then rejects the
 * first command. Replica set / mongos advertise setName or isdbgrid.
 */
async function deploymentSupportsTransactions(): Promise<boolean> {
  const db = mongoose.connection.db;
  if (!db) return false;
  const hello = await db.admin().command({ hello: 1 });
  return Boolean(hello.setName) || hello.msg === "isdbgrid";
}

/** Runs `fn` in a transaction when the deployment supports it (replica set / mongos). */
export async function withOptionalTransaction<T>(
  fn: (session: mongoose.ClientSession | undefined) => Promise<T>,
): Promise<T> {
  if (!(await deploymentSupportsTransactions())) {
    return fn(undefined);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    if (result instanceof NextResponse && result.status >= 400) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      return result;
    }
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => undefined);
    }
    if (isReplicaSetRequiredError(error)) {
      return fn(undefined);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function abortTransactionIfActive(
  session: mongoose.ClientSession | undefined,
): Promise<void> {
  if (session?.inTransaction()) {
    await session.abortTransaction();
  }
}
