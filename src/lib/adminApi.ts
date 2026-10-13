export const ADMIN_URL = "https://functions.poehali.dev/9418a5c8-dc4e-4ba3-9edd-88e20ffdc92a";

export async function adminGet(action: string, token?: string | null) {
  const res = await fetch(`${ADMIN_URL}?action=${action}`, {
    headers: token ? { "X-Authorization": token } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

export async function adminPost(action: string, payload: Record<string, unknown>, token?: string | null) {
  const res = await fetch(ADMIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}
