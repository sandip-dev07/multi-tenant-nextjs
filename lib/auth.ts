// lib/auth.ts
export const user = {
  session: {
    isAuthenticated: true,
    name: "Sandip",
    email: "xyz@gmail.com",
  },
};

export function getSession() {
  return user.session.isAuthenticated ? user.session : null;
}