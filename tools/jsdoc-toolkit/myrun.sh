#!/bin/sh

java -jar jsrun.jar app/run.js -t=templates/codeview/ -D="noGlobal:true" -r=2 ../../public/modules/ -d=../../public/modules/docs/
