import { test, expect, type Browser, type Page } from '@playwright/test'

// Each player is a separate browser context = a separate device with its own
// localStorage (player id, settings), all talking to the same Firestore emulator.
async function newDevice(browser: Browser, turnTimeout: number | 'manual' | 'admin' = 'manual') {
  const context = await browser.newContext()
  await context.addInitScript((timeout) => {
    if (!localStorage.getItem('toterninger-settings')) {
      localStorage.setItem('toterninger-settings', JSON.stringify({
        turnTimeout: timeout, animation: false, sound: false,
      }))
    }
  }, turnTimeout)
  return context.newPage()
}

async function createGame(host: Page, name: string) {
  await host.goto('/#/session/new')
  await host.getByPlaceholder('Skriv inn navnet ditt').fill(name)
  await host.getByRole('button', { name: 'Opprett spill' }).click()
  await expect(host).toHaveURL(/#\/session\/\d{3}-\d{3}-\d{3}$/)
  return host.url()
}

async function joinGame(page: Page, url: string, name: string) {
  await page.goto(url)
  await page.getByPlaceholder('Skriv inn navnet ditt').fill(name)
  await page.getByRole('button', { name: 'Bli med' }).click()
  await expect(page.getByText('Venter på at verten starter spillet...')).toBeVisible()
}

const sum = (p: Page) => p.locator('.sum-number')
const turn = (p: Page) => p.locator('.turn-text')

test('three devices play one session in manual turn mode', async ({ browser }) => {
  const anne = await newDevice(browser)
  const bjorn = await newDevice(browser)
  const cato = await newDevice(browser)

  const url = await createGame(anne, 'Anne')
  await joinGame(bjorn, url, 'Bjørn')
  await joinGame(cato, url, 'Cato')

  await expect(anne.getByText('Spillere (3)')).toBeVisible()
  await anne.getByRole('button', { name: 'Start spill' }).click()

  await expect(turn(anne)).toHaveText('Din tur!')
  await expect(turn(bjorn)).toHaveText('Anne kaster...')
  await expect(turn(cato)).toHaveText('Anne kaster...')
  await expect(bjorn.getByText('Venter på tur...')).toBeVisible()

  // Anne rolls; the result is mirrored on the other devices
  await anne.locator('.dice-roller').click()
  await expect(sum(anne)).toHaveText(/^([2-9]|1[0-2])$/)
  const anneSum = await sum(anne).textContent()
  await expect(sum(bjorn)).toHaveText(anneSum!)
  await expect(sum(cato)).toHaveText(anneSum!)

  // Not Bjørn's turn yet: tapping his dice does nothing
  await bjorn.locator('.dice-roller').click()
  await cato.getByRole('button', { name: /Statistikk/ }).click()
  await expect(cato.getByText('1 kast')).toBeVisible()

  // Manual mode: the turn is held until Anne passes it
  await expect(turn(anne)).toHaveText('Din tur!')
  await expect(bjorn.getByRole('button', { name: 'Gi turen videre' })).toHaveCount(0)
  await anne.getByRole('button', { name: 'Gi turen videre' }).click()

  await expect(turn(bjorn)).toHaveText('Din tur!')
  await expect(turn(anne)).toHaveText('Bjørn kaster...')

  await bjorn.locator('.dice-roller').click()
  await expect(cato.getByText('2 kast')).toBeVisible()
})

test('a player who reloads is still in the game', async ({ browser }) => {
  const host = await newDevice(browser)
  const guest = await newDevice(browser)

  const url = await createGame(host, 'Vert')
  await joinGame(guest, url, 'Gjest')
  await host.getByRole('button', { name: 'Start spill' }).click()
  await expect(turn(guest)).toHaveText('Vert kaster...')

  await guest.reload()
  await expect(turn(guest)).toHaveText('Vert kaster...')

  // Going home offers to rejoin the saved session
  await guest.goto('/')
  await expect(guest.getByText('Gjenoppta spillet som')).toBeVisible()
  await guest.getByRole('button', { name: 'Ja' }).click()
  await expect(turn(guest)).toHaveText('Vert kaster...')
})

test('timer mode passes the turn automatically after a roll', async ({ browser }) => {
  const host = await newDevice(browser, 30)
  const guest = await newDevice(browser, 30)

  const url = await createGame(host, 'Vert')
  await joinGame(guest, url, 'Gjest')
  await host.getByRole('button', { name: 'Start spill' }).click()

  await expect(host.locator('.timer')).toHaveText(/^\d+s\s*$/)
  await host.locator('.dice-roller').click()
  await expect(turn(guest)).toHaveText('Din tur!')
  await expect(turn(host)).toHaveText('Gjest kaster...')
})

test('admin mode: only the host can move the turn on', async ({ browser }) => {
  const host = await newDevice(browser, 'admin')
  const guest = await newDevice(browser, 'admin')

  const url = await createGame(host, 'Vert')
  await joinGame(guest, url, 'Gjest')
  await host.getByRole('button', { name: 'Start spill' }).click()

  await expect(guest.getByRole('button', { name: /Gi turen videre|Neste spiller/ })).toHaveCount(0)
  await host.getByRole('button', { name: 'Gi turen videre' }).click()
  await expect(turn(guest)).toHaveText('Din tur!')

  await guest.locator('.dice-roller').click()
  await expect(turn(guest)).toHaveText('Din tur!')
  await host.getByRole('button', { name: 'Neste spiller' }).click()
  await expect(turn(host)).toHaveText('Din tur!')
})
