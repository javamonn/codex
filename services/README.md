# services

External APIs that are used by the application.

- `assets`: Generic interfaces for accessing assets (i.e. audio files) from a variety of backing sources (e.g. Audible).
    - `types`: Shared types, including the generic `AssetService` interface.
    - `AudibleAssetsService`: An implementation of `AssetService` that uses the Audible API to access assets.
- `audible` - Handles interaction with the Audible API for OAuth, virtual device registration, and library access.
- `oauth-controller` - Generic OAuth controller used for token management, persistence, and refreshing.
