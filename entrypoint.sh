#!/bin/sh -l
IFS=$'\n\t'

# Execute the action code and output to file
node /index.js > action.log 2>&1
exit_code=$?

# Remove lines containing sensitive information from the log
sed -i '/::debug::/d' ./action.log
sed -i '/::add-mask::/d' ./action.log

# Output the log
cat action.log

# Exit using the exit code of the node command
exit $exit_code
