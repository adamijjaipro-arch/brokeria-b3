import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT standard — protège les routes qui nécessitent une authentification.
 * Utilisation : @UseGuards(JwtAuthGuard)
 *
 * Alternative : OptionalJwtAuthGuard pour les routes publiques/privées mixtes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
