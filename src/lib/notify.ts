import { prisma } from "./prisma";

export async function notify({
  userId,
  type,
  title,
  body,
  taskId,
  projectId,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  taskId?: string;
  projectId?: string;
}) {
  await prisma.notification.create({
    data: { userId, type, title, body, taskId: taskId ?? null, projectId: projectId ?? null },
  });
}

export async function logActivity({
  taskId,
  userId,
  action,
  oldValue,
  newValue,
}: {
  taskId: string;
  userId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
}) {
  await prisma.activityLog.create({
    data: { taskId, userId, action, oldValue: oldValue ?? null, newValue: newValue ?? null },
  });
}

