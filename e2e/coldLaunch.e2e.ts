/**
 * Basic E2E cold launch test
 * Note: Requires Detox to be configured in your environment and a built binary.
 * This test asserts that an onboarding element appears within 5 seconds on cold launch
 * when no session/users are present (default dev state).
 */

describe('Cold launch', () => { 
  it('shows onboarding entry within 5s', async () => {
    // @ts-ignore - global detox
    await device.launchApp({ newInstance: true, delete: true })

    // Expect to see a text from app/index.tsx landing (Get Started button)
    // within 5 seconds
    // @ts-ignore - global detox
    await waitFor(element(by.text('Get Started'))) 
      .toBeVisible()
      .withTimeout(5000)
  })
})
