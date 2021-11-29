//URLs
const HOME_URL = "http://localhost:3000"
const QUEUE_ADMIN_URL =(queueID)=> `${HOME_URL}/queue/${queueID}`
const TOKEN_URL = `${HOME_URL}/token/`

//CONFIG
const DEFAULT_TIMEOUT = {timeout: 7000}
const fileName = "helper.json"

//FAKE DATA
const INVALID_PHONE_NUM = "+420087456321"
const randValidPhoneNumber = () => "+916" + getRandInt(100000000, 999999999)
const NAMES = ["James", "Robert", "David", "Charles", "Mark", "Donald", "Steven"]

const QUEUE_INFO_TEXT = "There is no one ahead of you."

// LOCATORS
const byPhoneInput = "//input[@placeholder='Phone Number']"
const byNameInput = "//input[@placeholder='Name']"
const byNextButton = `(//div[contains(@class,'JoinForm')]//button)[1]`
const byJoinQueueButton = `(//div[contains(@class,'JoinForm')]//button)[1]`
const byStepBackButton = `(//div[contains(@class,'JoinForm')]//button)[2]`
const byRemoveMemberButton = (name) => `//*[text()="${name}"]//../..//*[@role="button"]`
const byAdminTokenList = `//*[contains(@class,'admin_token-list')]`
const byAdminTokenListItems = `${byAdminTokenList}//*[contains(@class,'admin_token__')]`
const byQueueNameInput = `//input[@placeholder='Line Name']`
const byQueueDeleteButton = `//*[contains(@class,"SidePanel_side-panel-item")][3]`
const byAddMemberTabButton = `//*[contains(@class,"SidePanel_side-panel-item")][1]//*[contains(@class,"descr")]`
const byStepperForm = `//*[contains(@class,"MuiStepper")]`

describe('Verification of Join Queue form', () => {

    let queueName = genRandString()
    let validUser = null

    before(() => {
        cy.viewport(1500, 900)
        createNewQueue()
    })

    beforeEach(() => {
        cy.viewport(1500, 900)
        cy.restoreLocalStorage();
    })

    afterEach(() => {
        cy.viewport(1500, 900)
        cy.saveLocalStorage()
    })

    after(() => {
        cy.viewport(1500, 900)
        // deleteQueue()
    })

    it('Verify display of stepper form with elements', () => {
        goToQueueJoinURL()
        cy.xpath(byStepperForm, DEFAULT_TIMEOUT).should('be.visible')
        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.visible").should("be.disabled")
        cy.xpath(byPhoneInput, DEFAULT_TIMEOUT).should('be.visible')
        cy.xpath(byNameInput).should('not.exist')
    })

    it('Verify valid incomplete phone number', () => {
        let randPhone = randValidPhoneNumber()
        goToQueueJoinURL()
        cy.xpath(byPhoneInput, DEFAULT_TIMEOUT).should('be.visible')
            .clear().type(randPhone.substring(0, randPhone.length - 4))
        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.disabled");
    })

    it('Verify invalid phone number', () => {
        goToQueueJoinURL()
        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.visible").should("be.disabled");
        cy.xpath(byPhoneInput, DEFAULT_TIMEOUT).should('be.visible').should("be.enabled")
            .clear().type(INVALID_PHONE_NUM)
        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.disabled");
    })

    it('Verify that valid not-used phone number create new token', () => {
        validUser = {phoneNumber: randValidPhoneNumber(), name: NAMES.random()}
        cy.log("User: ", validUser)
        goToQueueJoinURL()

        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.visible").should("be.disabled")
        cy.xpath(byPhoneInput, DEFAULT_TIMEOUT).should('be.visible').should("be.enabled")
            .clear().type(validUser.phoneNumber)

        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.enabled").click()
        cy.xpath(byStepBackButton).should('be.visible').should("be.enabled").click()
        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.enabled").click()

        cy.xpath(byJoinQueueButton, DEFAULT_TIMEOUT).should('be.visible').should("be.disabled")
        cy.xpath(byNameInput, DEFAULT_TIMEOUT).should("be.visible").should("be.enabled").type(validUser.name)
        cy.xpath(byJoinQueueButton, DEFAULT_TIMEOUT).should("be.enabled").click()
        cy.contains(QUEUE_INFO_TEXT, DEFAULT_TIMEOUT).should("be.visible")
        cy.url().should("contain", `${TOKEN_URL}`)
    })

    it('Verify that valid used phone number redirect to queue info page - uses existing token', () => {
        goToQueueJoinURL()
        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.visible").should("be.disabled");
        cy.xpath(byPhoneInput, DEFAULT_TIMEOUT).should('be.visible').should("be.enabled")
            .clear().type(validUser.phoneNumber)
        cy.xpath(byNextButton, DEFAULT_TIMEOUT).should("be.enabled").click();
        cy.wait(2000)
        cy.contains(QUEUE_INFO_TEXT, DEFAULT_TIMEOUT).should("be.visible")
        cy.url().should("contain", `${TOKEN_URL}`)
    })


    function removeMemberFromQueue(name) {
        cy.visit(QUEUE_ADMIN_URL(queueID))
        cy.wait(1500)
        cy.xpath(byAdminTokenList, DEFAULT_TIMEOUT).should("be.visible")
        cy.xpath("//body").type("{esc}")
        cy.xpath(byAdminTokenListItems, DEFAULT_TIMEOUT).then(elBefore => {
            let tokensLengthBefore = elBefore.length
            cy.xpath(byRemoveMemberButton(name), DEFAULT_TIMEOUT).should("be.visible").click()
            cy.xpath(byAdminTokenListItems, DEFAULT_TIMEOUT).then(elAfter => {
                let tokensLengthAfter = elAfter.length
                expect(tokensLengthAfter).to.equal(tokensLengthBefore - 1)
            })
        })
    }

    function createNewQueue() {
        cy.visit(HOME_URL)
        cy.wait(1500)
        cy.xpath(byQueueNameInput, DEFAULT_TIMEOUT).should("be.visible").type(queueName).type("{Enter}")
        cy.wait(1500)
        cy.location("pathname").then(str => {
            let arr = str.split("/")
            let token = arr[arr.length - 1]
            cy.writeFile(fileName, {token: token})
            cy.log(`Token: ${token}`)
        })
        cy.xpath("//body").type("{esc}")
        cy.scrollTo("top")
    }

    function deleteQueue() {
        cy.readFile(fileName).then(r => cy.visit(`${HOME_URL}/queue/${r.token}`))
        cy.wait(1500)
        cy.xpath(byQueueDeleteButton, DEFAULT_TIMEOUT).should("be.visible").click()
    }

    function goToQueueJoinURL() {
        cy.visit(`${HOME_URL}/j/${queueName}`)
        cy.wait(1500)
    }

})

Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}

function getRandInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function genRandString(length = 15) {
    return Math.random().toString(36).substr(2, length)
}