import { ACTIVITY_TYPE } from 'src/modules/users/enums/activity.enum';

export enum CHAT_TYPE {
  MESSAGE = 'message',
  ACTIVITY = 'activity',
}

export type MESSAGE = {
  roomId: string;
  message?: string;
  type: CHAT_TYPE;
  media?: string[];
  payload?: {
    activity: ACTIVITY_TYPE;
    data: Record<string, any>;
  };
};
