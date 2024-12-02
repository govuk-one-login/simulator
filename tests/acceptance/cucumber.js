module.exports={
    default: {
        publish: false,
        format: [
            "html:reports/cucumber-report.html",
            "json:reports/cucumber-report.json"
        ],
        paths: ["./tests/acceptance/features"],
        import: ["./tests/acceptance/step_definitions"],
    }
};