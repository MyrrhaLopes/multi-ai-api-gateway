export interface AiModelProvider {
    name: string;
    apiKey: string;
}

export const AiModelProvidersRegistry = {
    "open-ai": {
        name: "OpenAI",
        apiKey: "OPENAI_API_KEY"
    },
    "google": {
        name: "Google",
        apiKey: "GOOGLE_API_KEY"
    }
} satisfies Record<string, AiModelProvider>;

export type availableModelProviders = keyof typeof AiModelProvidersRegistry;

