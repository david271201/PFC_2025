SELECT 
  r.id,
  r.status,
  r.createdAt,
  COUNT(rr.id) as total_responses,
  COUNT(CASE WHEN rr.selected = true THEN 1 END) as selected_responses,
  GROUP_CONCAT(rr.status) as response_statuses
FROM Request r
LEFT JOIN RequestResponse rr ON r.id = rr.requestId
WHERE r.id = '7778129f-0093-4b88-b7d9-6e311c1687df'
GROUP BY r.id, r.status, r.createdAt;
