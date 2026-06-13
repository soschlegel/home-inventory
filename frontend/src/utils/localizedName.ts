import type { TFunction } from 'i18next';
import i18n from 'i18next';
import type { ContainerType, Room, Tag } from '../types';

type LocalizedRoom = Pick<Room, 'key' | 'name' | 'translations'>;
type LocalizedContainerType = Pick<ContainerType, 'key' | 'name' | 'translations'>;
type LocalizedTag = Pick<Tag, 'key' | 'name' | 'translations'>;

export const locRoomName = (t: TFunction, room: LocalizedRoom): string => {
  const lang = i18n.language;
  if (room.translations?.[lang]) return room.translations[lang];
  if (room.key) return t(`roomNames.${room.key}`, { defaultValue: room.name });
  return room.name;
};

export const locContainerTypeName = (t: TFunction, ct: LocalizedContainerType): string => {
  const lang = i18n.language;
  if (ct.translations?.[lang]) return ct.translations[lang];
  if (ct.key) return t(`containerTypeNames.${ct.key}`, { defaultValue: ct.name });
  return ct.name;
};

export const locTagName = (t: TFunction, tag: LocalizedTag): string => {
  const lang = i18n.language;
  if (tag.translations?.[lang]) return tag.translations[lang];
  if (tag.key) return t(`tagNames.${tag.key}`, { defaultValue: tag.name });
  return tag.name;
};

export const locUnitName = (
  t: TFunction,
  unit: { key: string; name: string; translations?: Record<string, string> | null },
): string => {
  const lang = i18n.language;
  if (unit.translations?.[lang]) return unit.translations[lang];
  return t(`unitNames.${unit.key}`, { defaultValue: unit.name });
};
