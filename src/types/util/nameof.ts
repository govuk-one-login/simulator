// nameof<SomeInterface>("someProperty") is equivalent to writing "someProperty", but enforces "someProperty" must exist
// on SomeInterface at compile time.
export const nameof = <T>(name: Extract<keyof T, string>): string => name;
