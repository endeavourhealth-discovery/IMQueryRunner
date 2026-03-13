type ApiOptions<T> = {
  raw?: boolean;
} & Parameters<typeof $fetch<T>>[1];

export async function useApi<T = unknown>(
  url: string,
  options: ApiOptions<T> = {},
): Promise<T | any> {
  const { raw = false, ...fetchOptions } = options;

  try {
    if (raw) {
      const res = await $fetch.raw(url, fetchOptions);

      return {
        status: res.status,
        data: res._data,
        headers: res.headers,
      };
    }

    return await $fetch<T>(url, fetchOptions);
  } catch (err) {
    // normal nuxt error flow
    throw err;
  }
}
