import { apiFetch } from "./client";
import { UserCreatePayload, UserUpdatePayload } from "@/types/api";
import { User } from "@/types/models";

export async function getUsers(): Promise<User[]> {
  return apiFetch<User[]>("/users");
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  return apiFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(userId: string, payload: UserUpdatePayload): Promise<User> {
  return apiFetch<User>(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
