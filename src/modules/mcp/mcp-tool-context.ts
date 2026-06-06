import { AuthenticatedUser } from '../auth/models/authenticated-user';

export interface McpToolContext {
  user: AuthenticatedUser;
}
