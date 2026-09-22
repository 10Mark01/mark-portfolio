import { parameters } from '../data/content.js';

export function ParametersTable() {
  return (
    <div className="tablewrap">
      <table>
        <caption className="sr-only">
          Technical skills, the tools used, and where each was applied.
        </caption>
        <thead>
          <tr>
            <th scope="col">Domain</th>
            <th scope="col">Tools &amp; languages</th>
            <th scope="col">Where I&rsquo;ve used it</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((row) => (
            <tr key={row.domain} className={row.todo ? 'is-todo' : undefined}>
              <th scope="row">{row.domain}</th>
              <td>{row.tools}</td>
              <td>{row.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
