import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './schemas/session.schema';
import { BlacklistedToken, BlacklistedTokenSchema } from './schemas/blacklisted-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SessionsModule {}
