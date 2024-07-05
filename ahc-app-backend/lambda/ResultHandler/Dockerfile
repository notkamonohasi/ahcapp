# syntax=docker/dockerfile:1
FROM python:3.10

ARG FUNCTION_DIR="/function"
ARG LAMBDA_FOLDER

RUN pip install awslambdaric boto3 pandas

COPY ${LAMBDA_FOLDER}/* ${FUNCTION_DIR}/

WORKDIR ${FUNCTION_DIR}

ENTRYPOINT [ "python", "-m", "awslambdaric" ]
CMD ["app.lambda_handler"]
