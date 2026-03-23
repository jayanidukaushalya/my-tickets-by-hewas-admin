/**
 * Public API infrastructure — re-exports everything needed to author an API
 * route in one import:
 *
 * ```ts
 * import {
 *   corsPreflightResponse,
 *   publicHandler,
 *   privateHandler,
 *   apiSuccess,
 *   apiError,
 *   apiValidationError,
 * } from "@/server/api"
 * ```
 */
export { CORS_HEADERS, corsPreflightResponse } from "./cors"
export { apiError, apiSuccess, apiValidationError } from "./response"
export type { ApiErrorResponse, ApiSuccessResponse } from "./response"
export { publicHandler, privateHandler } from "./handler"
export type {
  ApiHandlerContext,
  AuthenticatedApiHandlerContext,
} from "./handler"
