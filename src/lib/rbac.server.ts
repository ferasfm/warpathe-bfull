export const checkRole = async (
  supabase: any,
  userId: string,
  allowedRoles: string[],
) => {
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roles = (roleData?.map((r: any) => r.role) || []) as string[];
  if (!allowedRoles.some((role) => roles.includes(role))) {
    throw new Error("Forbidden: Insufficient permissions");
  }
};
