/**
 * Decorador customizado para extrair o usuário do request.
 * Facilita o acesso aos dados do usuário autenticado em controllers e services.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador @CurrentUser()
 * 
 * Uso:
 * @Get('profile')
 * @UseGuards(JwtGuard)
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);