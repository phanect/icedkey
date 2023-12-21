import { exec } from "child_process";

const execPromise = async (command: string): Promise<{ stdout: string, stderr: string }> =>
  new Promise((resolve, reject) =>
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      }

      resolve({ stdout, stderr });
    }));

export {
  execPromise as exec,
};
