import { ObjectId } from 'mongodb';

export interface ClanGamesSchedulersEntity {
  _id: ObjectId;
  guild: string;
  name: string;
  tag: string;
  duration: number;
  source?: string;
  reminderId: ObjectId;
  triggered: boolean;
  timestamp: Date;
  createdAt: Date;
}
