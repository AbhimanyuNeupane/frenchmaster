import { languageRepository } from "../repositories/language.repository";

export const languageService = {
  async listEnabledLanguages() {
    const languages = await languageRepository.findEnabledLanguages();
    return languages.map((l) => ({
      code: l.code,
      name: l.name,
      flagEmoji: l.flagEmoji,
      displayOrder: l.displayOrder,
      isDefault: l.isDefault,
    }));
  },
};
