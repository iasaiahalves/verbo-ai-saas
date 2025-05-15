 export const parseSection = (section: string): {
  title: string; points: string[]
} => {
  const lines = section.split('\n');
  const title = lines[0]; // First line is the title
  const contentLines = lines.slice(1); // Rest are content

  const cleanTitle = title.startsWith('#')
    ? title.substring(1).trim()
    : title.trim();
  
  const points: string[] = [];
  let currentPoint = '';

  contentLines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('•')) {
      if (currentPoint) points.push(currentPoint.trim())
      currentPoint = trimmedLine;
    } else if (!trimmedLine) {
      if (currentPoint) points.push(currentPoint.trim());
      currentPoint = '';
    } else {
      currentPoint += ' ' + trimmedLine;
    }
  });
  
  if (currentPoint) points.push(currentPoint.trim());
  
  return {
    title: cleanTitle,
    points: points.filter(
      (point) => point && !point.startsWith('#') && !point.startsWith('[Choose]')
    )
  };
}