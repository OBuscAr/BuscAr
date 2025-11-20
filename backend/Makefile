create-lines:
	python -m app.commands.create_lines

create-stops:
	python -m app.commands.create_stops

create-line-stops:
	python -m app.commands.create_line_stops

update-daily-line-statistics:
	python -m app.commands.update_daily_line_statistics

populate-database:
	make create-lines
	make create-stops
	make create-line-stops

init:
	pip install -r requirements.txt
	cp .env.sample .env

create-database-tables:
	python -m app.commands.create_database_tables

update-dependencies:
	pip-sync

run:
	fastapi run

create-stops-from-api:
	python -m app.commands.create_stops_from_api

test:
	pytest tests/ --html=tests/htmlcov/report.html --cov app --cov-config=.coveragerc --cov-report html:tests/htmlcov

open-test-coverage:
	open tests/htmlcov/index.html

open-test-report:
	open tests/htmlcov/report.html
