export default `
.wsg-plugins {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    min-width: 0;
}

.wsg-plugin-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 55vh;
    overflow-y: auto;
    padding-right: 4px;
}

.wsg-plugin-card {
    border-radius: 12px;
    padding: 12px 14px;
    background: var(--WDS-background-wash-inset);
}

.wsg-plugin-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.wsg-plugin-info,
.wsg-setting-label {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.wsg-plugin-settings {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--WDS-border-default, rgba(134, 150, 160, 0.25));
}

.wsg-setting {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wsg-setting-inline {
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.wsg-setting-error {
    color: var(--WDS-secondary-negative, #e78284);
    font-size: 0.8125rem;
}

.wsg-input {
    box-sizing: border-box;
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--WDS-border-default, rgba(134, 150, 160, 0.35));
    border-radius: 8px;
    background: var(--WDS-background-wash-plain);
    color: inherit;
    font: inherit;
    outline: none;
}

.wsg-input:focus {
    border-color: var(--WDS-accent);
}

textarea.wsg-input {
    resize: vertical;
}

.wsg-slider {
    display: flex;
    align-items: center;
    gap: 12px;
}

.wsg-slider input {
    flex: 1;
    accent-color: var(--WDS-accent);
}

.wsg-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--WDS-accent-deemphasized);
}

.wsg-icon-button {
    display: flex;
    padding: 6px;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--WDS-content-deemphasized);
    cursor: pointer;
}

.wsg-icon-button:hover:not(:disabled) {
    background: var(--WDS-background-wash-plain);
}

.wsg-icon-button:disabled {
    cursor: default;
    opacity: 0.4;
}
`;
