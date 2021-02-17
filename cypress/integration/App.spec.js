/// <reference types="cypress" />

import { Machine } from "xstate";
import { createModel } from "@xstate/test";

const feedbackMachine = Machine({
  id: "feedback",
  initial: "question",
  on: {
    ESC: "closed",
  },
  states: {
    question: {
      on: {
        CLICK_GOOD: "thanks",
        CLICK_BAD: "form",
        CLOSE: "closed",
      },
      meta: {
        test: function () {
          cy.get("[data-testid=question-screen]").contains(
            "How was your experience?"
          );
        },
      },
    },
    form: {
      on: {
        SUBMIT: [
          {
            target: "thanks",
            cond: (_, e) => e.value.length,
          },
          // This should probably target "closed",
          // but the demo app doesn't behave that way!
          { target: "thanks" },
        ],
        CLOSE: "closed",
      },
      meta: {
        test: function () {
          cy.get("[data-testid=form-screen]").contains("Care to tell us why?");
        },
      },
    },
    thanks: {
      on: {
        CLOSE: "closed",
      },
      meta: {
        test: function () {
          cy.get("[data-testid=thanks-screen]").contains(
            "Thanks for your feedback."
          );
        },
      },
    },
    closed: {
      type: "final",
      meta: {
        test: function () {
          cy.get("[data-testid=question-screen]").should("not.exist");
          cy.get("[data-testid=form-screen]").should("not.exist");
          cy.get("[data-testid=thanks-screen]").should("not.exist");
        },
      },
    },
  },
});

const testModel = createModel(feedbackMachine, {
  events: {
    CLICK_GOOD: function () {
      cy.get("[data-testid=good-button]").click();
    },
    CLICK_BAD: function () {
      cy.get("[data-testid=bad-button]").click();
    },
    CLOSE: function () {
      cy.get("[data-testid=close-button]").click();
    },
    ESC: function () {
      cy.get("body").type("{esc}");
      // And do this once again to avoid some occasional flake...
      cy.get("body").type("{esc}");
    },
    SUBMIT: {
      exec: function (_, event) {
        if (event.value?.length)
          cy.get("[data-testid=response-input]").type(event.value);
        cy.get("[data-testid=submit-button]").click();
      },
      cases: [{ value: "something" }, { value: "" }],
    },
  },
});

const itVisitsAndRunsPathTests = (url) => (path) =>
  it(path.description, function () {
    cy.visit(url).then(path.test);
  });

const itTests = itVisitsAndRunsPathTests(
  `http://localhost:${process.env.PORT || "3000"}`
);

context("Feedback App", () => {
  const testPlans = testModel.getSimplePathPlans();
  testPlans.forEach((plan) => {
    describe(plan.description, () => {
      plan.paths.forEach(itTests);
    });
  });
});
