interface FormatZodError {
    error: {
        validationContext?: string;
        validation?: Array<{
            instancePath: string;
            keywork?: string;
            message?: string;
            params?: {
                type?: string;
                missingProperty?: string;
            }
        }>
    }
}


export async function formatZodError({ error }: FormatZodError) {
    const validationContext = error.validationContext || 'body'

    const formatedError = {
        message: 'Invalid input',
        validation: [] as Array<{
            field: string;
            message: string;
            code: string;
            context: string;
        }>
    }

    if (Array.isArray(error.validation)) {
        for (const issue of error.validation) {
            let field = issue.instancePath.replace(/^\//, '') || ''
            if (issue.keywork === 'invalid_type' && issue.params?.type === 'required') {
                field = (issue.params.missingProperty as string) || field
            }

            formatedError.validation.push(
                {
                    field,
                    message: issue.message || 'Validation Error',
                    code: issue.keywork || 'unknown',
                    context: validationContext
                }
            )
        }
    }

    return formatedError
}