import { prisma } from "../lib/prisma";

const SETTING_KEY = "display_settings";

const DEFAULT_SETTINGS = {
  videoUrl: 'https://www.youtube.com/embed/videoseries?list=PL2_3w_50q_p_4i_t_aA-i1l_n5s-ZqGcB',
  footerText: 'Selamat datang di layanan Front Office kami. Kepuasan anda adalah prioritas kami.',
  colorScheme: 'default',
  soundUrl: 'chime.mp3'
};

export class SettingService {
  /**
   * Get Display Settings
   */
  async getSettings() {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SETTING_KEY }
    });

    if (!setting) {
      // Return default jika belum ada di DB
      return DEFAULT_SETTINGS;
    }

    try {
      return JSON.parse(setting.value);
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Update Settings
   */
  async updateSettings(newSettings: any) {
    // Merge dengan setting lama agar parsial update aman
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };

    const setting = await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: JSON.stringify(updated)
      },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(updated)
      }
    });

    return JSON.parse(setting.value);
  }
}
