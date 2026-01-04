export default interface Guard {
  hasPermission(
    accessToken: string,
    object: string,
    action: string
  ): Promise<boolean>;
}
