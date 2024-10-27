import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            include: [ "server/utils/**/*" ],
            reportsDirectory: "__tests__/unit/coverage"
        }
    }
})
