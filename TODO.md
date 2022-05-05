# Frontend

- [ ] `Add modal for rule tags`
- [x] `At least some popup to view tweets from the stream`
- [x] `When sending request to stop viewing, break recursive requests` 
- [ ] `Add authentication so users can log in with their own Twitter Dev accounts without a config file (likely will not be secure)`
    - [ ] `Add login button`
    - [ ] `Add login modal`
    - [ ] `Have login modal send login request`
- [ ] `Add support for advanced mode`

# Backend

- [x] `Make sure stop request actually resets stream rules to prevent going over monthly Tweet limit`
- [ ] `Add authentication so users can log in with their own Twitter Dev accounts without a config file (likely will not be secure)`
    - [ ] `Add api endpoint to receive logins`
    - [ ] `Refactor streaming to handle many streams`