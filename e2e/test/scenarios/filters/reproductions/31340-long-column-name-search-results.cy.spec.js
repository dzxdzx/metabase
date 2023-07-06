import { getBrokenUpTextMatcher, popover, restore } from "e2e/support/helpers";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";

const { PEOPLE_ID } = SAMPLE_DATABASE;
describe("issue 31340", function () {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();

    cy.createQuestion(
      {
        query: {
          "source-table": PEOPLE_ID,
          limit: 2,
        },
      },
      { visitQuestion: true },
    );

    cy.intercept("GET", "/api/field/*/search/*").as("search");
  });

  it("should properly display long column names in filter options search results (metabase#31340)", () => {
    const columnName = "Password";

    cy.findAllByTestId("header-cell").contains(columnName).click();

    popover().within(() => {
      cy.findByText("Filter by this column").click();

      cy.findByPlaceholderText(`Search by ${columnName}`).type(
        "nonexistingvalue",
      );

      cy.wait("@search");

      cy.findByText(getBrokenUpTextMatcher(`No matching ${columnName} found.`))
        .should("be.visible")
        .then($container => {
          cy.findByText(columnName).then($columnTextEl => {
            // TODO [32181]: this is needed to emulate a column with long name. Have to do it like this until we fix the mentioned issue.
            $columnTextEl[0].textContent =
              "Some very very very very long column name that should have a line break";

            const containerRect = $container[0].getBoundingClientRect();
            const columnTextRect = $columnTextEl[0].getBoundingClientRect();

            // check that text block is not wider than the popover
            expect(containerRect.width).to.be.lte(
              $container.parent()[0].getBoundingClientRect().width,
            );

            // check that column name is within the text block
            expect(columnTextRect.width).to.be.lte(containerRect.width);
            // and it takes no more than 1 line
            expect(columnTextRect.height).to.be.lte(20); // reasonable font size
          });
        });
    });
  });
});
