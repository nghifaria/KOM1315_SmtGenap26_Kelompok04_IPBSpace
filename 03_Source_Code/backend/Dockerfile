FROM python:3.14

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./app /code/app
COPY ./alembic /code/alembic
COPY ./alembic.ini /code/alembic.ini
COPY ./seed.py /code/seed.py

CMD ["sh", "-c", "alembic upgrade head && python /code/seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]