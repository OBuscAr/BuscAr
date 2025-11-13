create-lines:
	python -m app.commands.create_lines

create-stops:
	python -m app.commands.create_stops

create-line-stops:
	python -m app.commands.create_line_stops

populate-database:
	make create-lines
	make create-stops
	make create-line-stops

init:
	pip install -r requirements.txt
	cp .env.sample .env

update-dependencies:
	pip-sync

create-stops-from-api:
	python -m app.commands.create_stops_from_api

test:
	pytest tests/ --html=tests/htmlcov/report.html --cov app --cov-config=tests/.coveragerc --cov-report html:tests/htmlcov

open-test-coverage:
	open tests/htmlcov/index.html

open-test-report:
	open tests/htmlcov/report.html