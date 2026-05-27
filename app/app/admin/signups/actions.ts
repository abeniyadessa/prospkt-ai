"use server";

import { revalidatePath } from "next/cache";

export async function refreshSignups() {
  revalidatePath("/app/admin/signups");
}
