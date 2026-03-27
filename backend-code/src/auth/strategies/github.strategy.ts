import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

// Le profil normalisé qu'on passe au service
export interface GithubProfile {
  githubId: string;
  email: string | null;
  username: string;
  displayName: string;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID') ?? '',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') ?? '',
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL') ?? 'http://localhost:3001/auth/github/callback',
      // On demande l'email via le scope 'user:email'
      scope: ['user:email'],
    });
  }

  /**
   * Passport appelle cette méthode après le retour OAuth.
   * On retourne un objet GithubProfile simplifié → passé à handleGithubCallback.
   *
   * Architecture note : passport-github2 fournit parfois plusieurs emails.
   * On prend le premier email vérifié en priorité.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GithubProfile> {
    const primaryEmail =
      profile.emails?.find((e: any) => e.verified)?.value ??
      profile.emails?.[0]?.value ??
      null;

    return {
      githubId: profile.id,
      email: primaryEmail,
      username: profile.username ?? `github_${profile.id}`,
      displayName: profile.displayName ?? profile.username ?? '',
    };
  }
}
