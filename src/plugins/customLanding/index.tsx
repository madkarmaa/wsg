import { definePluginSettings } from '@api/Settings';
import { APP_NAME, Devs } from '@utils/constants';
import definePlugin, { OptionType } from '@utils/types';
import cat from './cat.gif';

const settings = definePluginSettings({
    title: {
        type: OptionType.STRING,
        description: 'Text shown on the landing screen',
        default: `Welcome to ${APP_NAME} :3`
    },
    showCat: {
        type: OptionType.BOOLEAN,
        description: 'Show the cat',
        default: true
    }
});

function Landing() {
    const { title, showCat } = settings.use(['title', 'showCat']);

    return (
        <div className="wsg-landing">
            <h2 className="wsg-landing-title">{title}</h2>
            {showCat && <img className="wsg-landing-cat" src={cat} alt="Cat" />}
        </div>
    );
}

export default definePlugin({
    name: 'CustomLanding',
    description: 'Replaces the screen shown when no chat is open.',
    authors: [Devs.madkarma],
    enabledByDefault: true,
    settings,

    managedStyle: `
        .wsg-landing {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3rem;
            height: 100%;
        }
        .wsg-landing-title {
            font-size: 3rem;
            font-weight: bold;
            color: var(--WDS-accent);
            text-align: center;
        }
        .wsg-landing-cat {
            width: 12rem;
            aspect-ratio: 1;
            border-radius: 50%;
        }
    `,

    patches: [
        {
            module: 'WAWebIntroPanelV2.react',
            replacement: {
                match: /(\i\.default=)\i(?=\}$)/,
                replace: '$1$self.Landing'
            }
        }
    ],

    Landing
});
