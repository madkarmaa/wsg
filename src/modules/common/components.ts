import type { ComponentType, ReactNode } from 'react';
import { findModuleComponentLazy } from '../components';
import { findModule } from '../modules';

// Typings only cover the props WSG uses

export type IconComponent = ComponentType<{ width?: number; height?: number }>;

export const findIcon = (name: string) =>
    findModule<{ default: IconComponent }>(`WDSIcon${name}.react`)?.default;

export interface MenuItemProps {
    title: ReactNode;
    subtitle?: ReactNode;
    Icon?: IconComponent;
    onPress?(event?: Event): void;
    testid?: string;
    type?: 'separator';
    disabled?: boolean;
    destructive?: boolean;
    closeMenuOnPress?: boolean;
}
export const MenuItem = findModuleComponentLazy<MenuItemProps>('WDSMenuItem.react');

export interface SwitchProps {
    value: boolean;
    onChange(value: boolean): void;
    disabled?: boolean;
    'aria-label'?: string;
    testid?: string;
}
export const Switch = findModuleComponentLazy<SwitchProps>('WDSSwitch.react');

export interface ButtonProps {
    label: ReactNode;
    onPress?(event: Event): void;
    variant?: 'filled' | 'outline' | 'borderless' | 'tonal';
    type?: 'default' | 'destructive';
    size?: 'small' | 'medium' | 'large';
    Icon?: IconComponent;
    disabled?: boolean;
    loading?: boolean;
    testid?: string;
}
export const Button = findModuleComponentLazy<ButtonProps>('WDSButton.react');

export type TextType =
    | 'Body1'
    | 'Body1Emphasized'
    | 'Body2'
    | 'Body2Emphasized'
    | 'Body3'
    | 'Body3Emphasized'
    | 'Headline1'
    | 'Headline2'
    | 'LargeTitle1'
    | 'LargeTitle2';

export type TextColor =
    | 'accent'
    | 'contentDefault'
    | 'contentDeemphasized'
    | 'contentDisabled'
    | 'contentActionDefault'
    | 'contentActionEmphasized'
    | 'contentExternalLink'
    | 'secondaryNegative'
    | 'secondaryPositive'
    | 'secondaryWarning';

export interface TextProps {
    type: TextType;
    colorName?: TextColor;
    maxLines?: number;
    children?: ReactNode;
}
export const Text = findModuleComponentLazy<TextProps>('WDSText.react');

export interface ConfirmPopupProps {
    title?: ReactNode;
    children?: ReactNode;
    okText?: ReactNode;
    cancelText?: ReactNode;
    onOK?(): void;
    onCancel?(): void;
    okDisabled?: boolean;
}
export const ConfirmPopup = findModuleComponentLazy<ConfirmPopupProps>(
    'WAWebConfirmPopup.react',
    'ConfirmPopup'
);

export interface ToastProps {
    id: string;
    msg: ReactNode;
    duration?: number;
    action?: { actionText: ReactNode; onAction(): void };
}
export const Toast = findModuleComponentLazy<ToastProps>('WAWebToast.react', 'Toast');
