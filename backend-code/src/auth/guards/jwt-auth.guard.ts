import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';

/**
 * Guard JWT standard — protège les routes qui nécessitent une authentification.
 * En mode DEV: accepte un header 'x-dev-user-id' pour bypasser l'authentification
 * Utilisation : @UseGuards(JwtAuthGuard)
 *
 * Alternative : OptionalJwtAuthGuard pour les routes publiques/privées mixtes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Observable<boolean> | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Mode DEV: bypass avec header x-dev-user-id
    if (process.env.NODE_ENV !== 'production') {
      const devUserId = request.headers['x-dev-user-id'];
      if (devUserId) {
        // Inject user dans la requête
        request.user = { id: devUserId as string };
        return true;
      }
    }

    // Sinon, valider le JWT normalement
    return super.canActivate(context);
  }
}

