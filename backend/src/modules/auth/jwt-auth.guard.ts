import { ForbiddenException, Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const result = super.handleRequest(err, user, info, context);
    const request = context.switchToHttp().getRequest();
    if (result?.forcePasswordChange && !/\/auth\/(change-password|logout|refresh)(\/|$)/.test(request.path || '')) {
      throw new ForbiddenException('Debe cambiar su contraseña antes de continuar.');
    }
    return result;
  }
}
