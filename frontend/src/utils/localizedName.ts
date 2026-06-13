import type { TFunction } from 'i18next';
import type { ContainerType, Room } from '../types';

export const locContainerTypeName = (
  t: TFunction,
  ct: Pick<ContainerType, 'key' | 'name'>,
): string =>
  ct.key ? t(`containerTypeNames.${ct.key}`, { defaultValue: ct.name }) : ct.name;

export const locRoomName = (
  t: TFunction,
  room: Pick<Room, 'key' | 'name'>,
): string =>
  room.key ? t(`roomNames.${room.key}`, { defaultValue: room.name }) : room.name;
