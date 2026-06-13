import type { TFunction } from 'i18next';
import i18n from 'i18next';
import type { ContainerType, Room } from '../types';

export const locContainerTypeName = (
  t: TFunction,
  ct: Pick<ContainerType, 'key' | 'name' | 'nameDe' | 'nameEn'>,
): string => {
  const lang = i18n.language;
  if (lang === 'de' && ct.nameDe) return ct.nameDe;
  if (lang === 'en' && ct.nameEn) return ct.nameEn;
  if (ct.key) return t(`containerTypeNames.${ct.key}`, { defaultValue: ct.name });
  return ct.name;
};

export const locRoomName = (
  t: TFunction,
  room: Pick<Room, 'key' | 'name'>,
): string =>
  room.key ? t(`roomNames.${room.key}`, { defaultValue: room.name }) : room.name;
