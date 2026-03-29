const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export const DEFAULT_CUSTOM_ACCENT = '#7c8cff';

export const normalizeThemeAccent = (value = '') => {
    const normalizedValue = String(value).trim();
    if (/^#[0-9a-f]{3}$/i.test(normalizedValue)) {
        return `#${normalizedValue
            .slice(1)
            .split('')
            .map((segment) => `${segment}${segment}`)
            .join('')}`.toLowerCase();
    }

    return HEX_COLOR_PATTERN.test(normalizedValue) ? normalizedValue.toLowerCase() : '';
};

export const resolveThemeAccent = (value = '', fallback = DEFAULT_CUSTOM_ACCENT) => {
    const normalizedValue = normalizeThemeAccent(value);
    if (normalizedValue) {
        return normalizedValue;
    }

    return normalizeThemeAccent(fallback) || DEFAULT_CUSTOM_ACCENT;
};

const clampChannel = (value) => Math.min(Math.max(Math.round(value), 0), 255);

const hexToRgb = (value) => {
    const normalizedValue = resolveThemeAccent(value);
    return {
        red: Number.parseInt(normalizedValue.slice(1, 3), 16),
        green: Number.parseInt(normalizedValue.slice(3, 5), 16),
        blue: Number.parseInt(normalizedValue.slice(5, 7), 16),
    };
};

const rgbToHex = ({ red, green, blue }) =>
    `#${[red, green, blue]
        .map((channel) => clampChannel(channel).toString(16).padStart(2, '0'))
        .join('')}`;

const mixHexColors = (source, target, amount) => {
    const sourceRgb = hexToRgb(source);
    const targetRgb = hexToRgb(target);

    return rgbToHex({
        red: sourceRgb.red + ((targetRgb.red - sourceRgb.red) * amount),
        green: sourceRgb.green + ((targetRgb.green - sourceRgb.green) * amount),
        blue: sourceRgb.blue + ((targetRgb.blue - sourceRgb.blue) * amount),
    });
};

const toRgba = (value, alpha) => {
    const { red, green, blue } = hexToRgb(value);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const deriveCustomAccentPreset = (value = DEFAULT_CUSTOM_ACCENT) => {
    const color = resolveThemeAccent(value);
    const soft = mixHexColors(color, '#ffffff', 0.18);
    const strong = mixHexColors(color, '#0f172a', 0.28);

    return {
        key: 'custom',
        label: 'Custom Accent',
        color,
        strong,
        gradient: `linear-gradient(135deg, ${toRgba(soft, 0.96)}, ${toRgba(color, 0.9)}, ${toRgba(strong, 0.88)})`,
        mood: `Personal palette · ${color.toUpperCase()}`,
    };
};
